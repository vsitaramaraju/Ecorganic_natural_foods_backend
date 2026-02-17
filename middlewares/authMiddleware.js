const jwt = require('jsonwebtoken');
const prisma = require('../src/utils/prisma');

exports.authenticateToken = async (req, res, next) => {
    try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();

} catch (error) {
    res.status(500).json({ error: 'Failed to authenticate token' });
}
};

exports.authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};