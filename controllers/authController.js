const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../src/utils/prisma");


exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        const user = await prisma.user.create({ data: { name, email, password: hashedPassword }, });
        res.status(201).json({ message: "User registered" })

    }
    catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.login = async (req, res) => {
    try {

        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "invalid credentials" });
        }
        const token = jwt.sign(
            {userId:user.id,role:user.role},process.env.JWT_SECRET, {expiresIn:"2d"}
        );

        res.json({token, user:{id:user.id, name:user.name, email:user.email, role:user.role}});

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
