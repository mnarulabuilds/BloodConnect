const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const env = require('../config/env');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, text) => {
    try {
        transporter.verify((error, success) => {
            if (error) {
                logger.error(error);
            } else {
                logger.info("SMTP server is ready --- (success)", success);
            }
        });
        await transporter.sendMail({
            from: env.EMAIL_USER,
            to,
            subject,
            text,
        });
    } catch (error) {
        logger.error(`Sending mail failed with error - `, error)
    }
};

module.exports = sendEmail;