const prisma = require("../src/utils/prisma");

const parseProductId = (value) => {
    const productId = parseInt(value, 10);

    if (Number.isNaN(productId)) {
        return null;
    }

    return productId;
};

const parseRating = (value) => {
    const rating = parseInt(value, 10);

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
        return null;
    }

    return rating;
};

const normalizeComment = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const comment = String(value).trim();
    return comment.length > 0 ? comment : null;
};

const reviewInclude = {
    user: {
        select: {
            id: true,
            name: true,
        },
    },
};

const buildReviewSummary = (reviews) => {
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
        };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

    return {
        averageRating: Number((totalRating / totalReviews).toFixed(1)),
        totalReviews,
    };
};

const getProductOr404 = async (productId, res) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }

    return product;
};

exports.getProductReviews = async (req, res) => {
    try {
        const productId = parseProductId(req.params.productId);

        if (!productId) {
            return res.status(400).json({ error: "Invalid product id" });
        }

        const product = await getProductOr404(productId, res);

        if (!product) {
            return;
        }

        const reviews = await prisma.review.findMany({
            where: { productId },
            include: reviewInclude,
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            productId,
            productName: product.name,
            reviewSummary: buildReviewSummary(reviews),
            reviews,
        });
    } catch (error) {
        console.log("Error fetching product reviews:", error);
        res.status(500).json({ error: "Failed to fetch product reviews" });
    }
};

exports.createProductReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = parseProductId(req.params.productId);
        const rating = parseRating(req.body.rating);
        const comment = normalizeComment(req.body.comment);

        if (!productId) {
            return res.status(400).json({ error: "Invalid product id" });
        }

        if (!rating) {
            return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
        }

        const product = await getProductOr404(productId, res);

        if (!product) {
            return;
        }

        const existingReview = await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (existingReview) {
            return res.status(409).json({
                error: "Review already exists for this product. Use update API instead.",
            });
        }

        const review = await prisma.review.create({
            data: {
                userId,
                productId,
                rating,
                comment,
            },
            include: reviewInclude,
        });

        res.status(201).json({
            message: "Review added successfully",
            review,
        });
    } catch (error) {
        console.log("Error creating review:", error);
        res.status(500).json({ error: "Failed to add review" });
    }
};

exports.updateProductReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = parseProductId(req.params.productId);
        const rating = parseRating(req.body.rating);
        const comment = normalizeComment(req.body.comment);

        if (!productId) {
            return res.status(400).json({ error: "Invalid product id" });
        }

        if (!rating) {
            return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
        }

        const existingReview = await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (!existingReview) {
            return res.status(404).json({ error: "Review not found for this product" });
        }

        const review = await prisma.review.update({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
            data: {
                rating,
                comment,
            },
            include: reviewInclude,
        });

        res.status(200).json({
            message: "Review updated successfully",
            review,
        });
    } catch (error) {
        console.log("Error updating review:", error);
        res.status(500).json({ error: "Failed to update review" });
    }
};

exports.deleteProductReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = parseProductId(req.params.productId);

        if (!productId) {
            return res.status(400).json({ error: "Invalid product id" });
        }

        const existingReview = await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (!existingReview) {
            return res.status(404).json({ error: "Review not found for this product" });
        }

        await prisma.review.delete({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        console.log("Error deleting review:", error);
        res.status(500).json({ error: "Failed to delete review" });
    }
};