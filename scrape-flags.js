import fetch from 'node-fetch';
import { PrismaClient } from './generated/prisma/index.js'

const prisma = new PrismaClient();

const fieldsToFetch = ["name", "cca2", "flags", "flag"];
const commonFlags = ["United States", "Japan", "United Kingdom", "Italy", "Canada", "France", "Switzerland", "China", "Germany"]

const fetchCountryData = async () => {
    const res = await fetch(`https://restcountries.com/v3.1/independent?status=true&fields=${fieldsToFetch.join(',')}`);
    const countries = await res.json();

    return countries.map(country => ({
        name: country.name.common,
        code: country.cca2.toLowerCase(),
        isCommon: commonFlags.includes(country.name.common),
    }))
}

const uploadToDB = async (countryData) => {
    for (const country of countryData) {
        await prisma.country.upsert({
            where: { code: country.code },
            update: {},
            create: country,
        });
    }
}

const main = async () => {
    const countryData = await fetchCountryData();
    uploadToDB(countryData);

    console.log(`Fetched and uploaded flag data for ${countryData.length} countries.`);
};

main()
  .catch(e => console.log(`Error: ${e}`))
  .finally(() => prisma.$disconnect());
