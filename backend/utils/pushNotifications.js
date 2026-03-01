const PushToken = require('../models/PushToken');
const logger = require('../config/logger');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Sends Expo push notifications to a list of push tokens.
 * Handles chunking (Expo allows max 100 per request) and cleans up invalid tokens.
 */
async function sendPushNotifications(pushTokens, { title, body, data = {} }) {
  if (!pushTokens.length) return;

  const messages = pushTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    channelId: 'blood-requests',
  }));

  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();

      if (result.data) {
        const invalidTokens = [];
        result.data.forEach((receipt, idx) => {
          if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(chunk[idx].to);
          }
        });

        if (invalidTokens.length) {
          await PushToken.deleteMany({ token: { $in: invalidTokens } });
          logger.info({ count: invalidTokens.length }, 'Cleaned up invalid push tokens');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Failed to send push notifications');
    }
  }
}

/**
 * Notifies all donors with a matching blood group about a new blood request.
 * Excludes the requestor themselves.
 */
async function notifyMatchingDonors(bloodRequest, requestorId) {
  try {
    const User = require('../models/User');

    const matchingDonors = await User.find({
      role: 'donor',
      bloodGroup: bloodRequest.bloodGroup,
      isAvailable: true,
      _id: { $ne: requestorId },
    }).select('_id');

    if (!matchingDonors.length) {
      logger.info({ bloodGroup: bloodRequest.bloodGroup }, 'No matching donors found for notification');
      return;
    }

    const donorIds = matchingDonors.map((d) => d._id);

    const tokens = await PushToken.find({ userId: { $in: donorIds } }).select('token');
    const pushTokens = tokens.map((t) => t.token);

    if (!pushTokens.length) {
      logger.info({ bloodGroup: bloodRequest.bloodGroup, donorCount: donorIds.length }, 'Matching donors found but none have push tokens');
      return;
    }

    const urgencyEmoji = bloodRequest.urgency === 'Critical' ? '🚨' : bloodRequest.urgency === 'Urgent' ? '⚠️' : 'ℹ️';

    await sendPushNotifications(pushTokens, {
      title: `${urgencyEmoji} ${bloodRequest.bloodGroup} Blood Needed`,
      body: `${bloodRequest.urgency} request at ${bloodRequest.location}. ${bloodRequest.units || 1} unit(s) needed.`,
      data: {
        type: 'blood_request',
        requestId: bloodRequest._id.toString(),
        bloodGroup: bloodRequest.bloodGroup,
      },
    });

    logger.info(
      { requestId: bloodRequest._id, bloodGroup: bloodRequest.bloodGroup, notified: pushTokens.length },
      'Push notifications sent to matching donors'
    );
  } catch (err) {
    logger.error({ err, requestId: bloodRequest._id }, 'Failed to notify matching donors');
  }
}

module.exports = { sendPushNotifications, notifyMatchingDonors };
