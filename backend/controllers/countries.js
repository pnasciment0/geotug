 import prisma from '../lib/prisma.js';

 export const getRandomCountry = async (req, res) => {
    try {
        const randomCountry = await prisma.$queryRaw`SELECT * FROM "Country" WHERE "isCommon" = FALSE ORDER BY RANDOM() LIMIT 1`;
        console.log('Random Country:', randomCountry);
        res.status(200).json(randomCountry[0]); // Return the first country from the result

    } catch (error) {
        console.log('Error fetching random country:', error);
        res.status(500).json({ error: 'Server Error: ${error}' });   
    }
 };