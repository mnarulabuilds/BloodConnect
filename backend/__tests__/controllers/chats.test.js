const mongoose = require('mongoose');
const chats = require('../../controllers/chats');
const Chat = require('../../models/Chat');
const Message = require('../../models/Message');
const { mockRes, mockNext } = require('../helpers');

jest.mock('../../models/Chat');
jest.mock('../../models/Message');

const chatId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';
const otherId = '507f1f77bcf86cd799439013';

const createSession = () => ({
  startTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  endSession: jest.fn(),
});

describe('chats controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(createSession());
  });

  afterEach(() => {
    mongoose.startSession.mockRestore();
  });

  it('lists chats for user', async () => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    Chat.find.mockReturnValue(chain);
    Chat.countDocuments.mockResolvedValue(0);

    const res = mockRes();
    await chats.getChats({ user: { id: userId }, query: {} }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getChatById returns 404 when missing', async () => {
    Chat.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
    });
    const res = mockRes();
    await chats.getChatById({ params: { id: chatId }, user: { id: userId } }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getChatById enforces participant access', async () => {
    Chat.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: undefined,
    });
    const chat = {
      participants: [{ _id: { toString: () => otherId } }],
    };
    Chat.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(chat),
      }),
    });

    const res = mockRes();
    await chats.getChatById({ params: { id: chatId }, user: { id: userId } }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('getChatById returns chat for participant', async () => {
    const chat = {
      participants: [{ _id: { toString: () => userId } }],
    };
    Chat.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(chat),
      }),
    });
    const res = mockRes();
    await chats.getChatById({ params: { id: chatId }, user: { id: userId } }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getMessages returns 404 for missing chat', async () => {
    Chat.findById.mockResolvedValue(null);
    const res = mockRes();
    await chats.getMessages({ params: { id: chatId }, user: { id: userId }, query: {} }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getMessages returns paginated messages for participant', async () => {
    Chat.findById.mockResolvedValue({
      participants: [userId],
    });
    Message.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    Message.countDocuments.mockResolvedValue(0);

    const res = mockRes();
    await chats.getMessages({ params: { id: chatId }, user: { id: userId }, query: {} }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('startChat reuses existing chat', async () => {
    const existing = { _id: chatId };
    Chat.findOne.mockResolvedValue(existing);
    const res = mockRes();
    await chats.startChat({ user: { id: userId }, body: { recipientId: otherId } }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Chat.create).not.toHaveBeenCalled();
  });

  it('startChat creates new chat when none exists', async () => {
    Chat.findOne.mockResolvedValue(null);
    Chat.create.mockResolvedValue({ _id: chatId });
    const res = mockRes();
    await chats.startChat({ user: { id: userId }, body: { recipientId: otherId } }, res, mockNext());
    expect(Chat.create).toHaveBeenCalled();
  });

  it('sendMessage returns 404 when chat missing', async () => {
    Chat.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });
    const res = mockRes();
    await chats.sendMessage(
      { params: { id: chatId }, user: { id: userId }, body: { text: 'Hi' } },
      res,
      mockNext()
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('sendMessage rejects non-participant', async () => {
    Chat.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue({ participants: [otherId] }),
    });

    const res = mockRes();
    await chats.sendMessage(
      { params: { id: chatId }, user: { id: userId }, body: { text: 'Hi' } },
      res,
      mockNext()
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('forwards list errors to next', async () => {
    Chat.find.mockImplementation(() => {
      throw new Error('list fail');
    });
    const next = mockNext();
    await chats.getChats({ user: { id: userId }, query: {} }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('sendMessage persists message for participant', async () => {
    Chat.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue({ participants: [userId] }),
    });
    Message.create.mockResolvedValue([{ _id: '507f1f77bcf86cd799439014', text: 'Hi' }]);
    Chat.findByIdAndUpdate.mockReturnValue({ session: jest.fn().mockResolvedValue({}) });

    const res = mockRes();
    await chats.sendMessage(
      { params: { id: chatId }, user: { id: userId }, body: { text: 'Hi' } },
      res,
      mockNext()
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
