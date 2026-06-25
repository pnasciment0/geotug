 import prisma from '../lib/prisma.js';

export const randomCountryFromDB = async () => {
    try {
        const randomCountry = await prisma.$queryRaw`SELECT * FROM "Country" WHERE "isCommon" = FALSE ORDER BY RANDOM() LIMIT 1`;
        return randomCountry[0];

    } catch (error) {
        console.log('Error fetching random country:', error);
        throw new Error(`Server Error: ${error}`);
    }

}

 export const getRandomCountry = async (req, res) => {
    try {
        const randomCountry = await randomCountryFromDB();
        res.status(200).json(randomCountry); 

    } catch (error) {
        console.log('Error fetching random country:', error);
        res.status(500).json({ error: 'Server Error: ${error}' });   
    }
 };