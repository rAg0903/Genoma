const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const environment = require('../config/environment');
const userRepository = require('../repositories/utilizadores.repository');

const RESET_TOKEN_TTL_MINUTES = 30;

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.register = async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await userRepository.create({
        ...data,
        password_hash: hashedPassword
    });
};

exports.login = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) throw new Error('Utilizador não encontrado');

    if (!user.password_hash) {
        throw new Error('Conta sem password definida. Utilize Recuperar Password para definir a primeira password.');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) throw new Error('Password inválida');

    const token = jwt.sign(
        {
            id: user.id,
            role: user.perfil_id
        },
        environment.JWT.secret,
        { expiresIn: environment.JWT.expiration }
    );

    return token;
};

exports.forgotPassword = async ({ email }) => {
    if (!email) throw new Error('Email é obrigatório');

    const normalizedEmail = String(email).trim().toLowerCase();
    const genericResponse = {
        message: 'Se o email existir, recebeu instruções para redefinir a password.'
    };

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
        return genericResponse;
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await userRepository.update(user.id, {
        reset_token_hash: resetTokenHash,
        reset_token_expires_at: expiresAt
    });

    if (process.env.NODE_ENV !== 'production') {
        return {
            ...genericResponse,
            resetToken,
            expiresInMinutes: RESET_TOKEN_TTL_MINUTES
        };
    }

    return genericResponse;
};

exports.resetPassword = async ({ token, newPassword }) => {
    if (!token) throw new Error('Token de recuperação é obrigatório');
    if (!newPassword) throw new Error('Nova password é obrigatória');
    if (String(newPassword).length < 6) throw new Error('Password deve ter no mínimo 6 caracteres');

    const tokenHash = hashResetToken(String(token).trim());
    const user = await userRepository.findByResetTokenHash(tokenHash);

    if (!user) {
        throw new Error('Token inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    await userRepository.update(user.id, {
        password_hash: hashedPassword,
        reset_token_hash: null,
        reset_token_expires_at: null
    });

    return { message: 'Password redefinida com sucesso' };
};