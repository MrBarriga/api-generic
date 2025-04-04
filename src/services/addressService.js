const Address = require('../models/Address');
const axios = require('axios');

/**
 * Criar um novo endereço
 */
async function createAddress(addressData) {
    const {
        user_id, school_id, parking_id, line1, line2,
        city, state, postal_code, country, latitude, longitude, address_type
    } = addressData;

    // Verificar se já existe um endereço vinculado (para school_id e parking_id)
    if (school_id) {
        const existingAddress = await Address.findOne({ where: { school_id } });
        if (existingAddress) {
            throw new Error("Esta escola já possui um endereço cadastrado");
        }
    }

    if (parking_id) {
        const existingAddress = await Address.findOne({ where: { parking_id } });
        if (existingAddress) {
            throw new Error("Este estacionamento já possui um endereço cadastrado");
        }
    }

    // Obter coordenadas se não fornecidas, mas CEP e outros campos estão presentes
    let coords = { latitude, longitude };
    if (!latitude || !longitude) {
        if (postal_code && city && state) {
            try {
                coords = await getCoordinatesFromAddress(line1, city, state, postal_code, country);
            } catch (error) {
                console.error("Erro ao obter coordenadas:", error);
                // Continua o processo mesmo sem coordenadas
            }
        }
    }

    // Criar o endereço
    const address = await Address.create({
        user_id,
        school_id,
        parking_id,
        line1,
        line2,
        city,
        state,
        postal_code,
        country: country || 'Brasil',
        latitude: coords.latitude,
        longitude: coords.longitude,
        address_type: address_type || 'RESIDENTIAL',
        created_at: new Date(),
        updated_at: new Date()
    });

    return address;
}

/**
 * Atualizar um endereço existente
 */
async function updateAddress(id, addressData) {
    const {
        line1, line2, city, state, postal_code,
        country, latitude, longitude, address_type
    } = addressData;

    // Verificar se o endereço existe
    const address = await Address.findByPk(id);
    if (!address) {
        throw new Error("Endereço não encontrado");
    }

    // Obter coordenadas se não fornecidas, mas CEP e outros campos foram atualizados
    let coords = { latitude, longitude };
    if ((!latitude || !longitude) && (line1 || postal_code || city || state)) {
        try {
            // Use os valores atualizados ou os existentes se não fornecidos
            const addressLine = line1 || address.line1;
            const addressCity = city || address.city;
            const addressState = state || address.state;
            const addressPostalCode = postal_code || address.postal_code;
            const addressCountry = country || address.country;

            coords = await getCoordinatesFromAddress(
                addressLine, addressCity, addressState, addressPostalCode, addressCountry
            );
        } catch (error) {
            console.error("Erro ao obter coordenadas:", error);
            // Manter as coordenadas existentes se houver erro
            coords = {
                latitude: address.latitude,
                longitude: address.longitude
            };
        }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (line1) updateData.line1 = line1;
    if (line2 !== undefined) updateData.line2 = line2;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (postal_code) updateData.postal_code = postal_code;
    if (country) updateData.country = country;
    if (coords.latitude) updateData.latitude = coords.latitude;
    if (coords.longitude) updateData.longitude = coords.longitude;
    if (address_type) updateData.address_type = address_type;
    updateData.updated_at = new Date();

    await address.update(updateData);
    return await Address.findByPk(id);
}

/**
 * Obter endereço por ID
 */
async function getAddressById(id) {
    const address = await Address.findByPk(id);
    if (!address) {
        throw new Error("Endereço não encontrado");
    }
    return address;
}

/**
 * Listar endereços de um usuário
 */
async function getUserAddresses(userId) {
    const addresses = await Address.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
    });
    return addresses;
}

/**
 * Remover um endereço
 */
async function deleteAddress(id) {
    // Verificar se o endereço existe
    const address = await Address.findByPk(id);
    if (!address) {
        throw new Error("Endereço não encontrado");
    }

    // Verificar se é um endereço que pode ser removido
    // Endereços de escolas e estacionamentos não devem ser removidos diretamente
    if (address.school_id || address.parking_id) {
        throw new Error("Este endereço está vinculado a uma escola ou estacionamento e não pode ser removido diretamente");
    }

    await address.destroy();
    return true;
}

/**
 * Função auxiliar para obter coordenadas a partir de um endereço
 * Esta é uma implementação de exemplo usando uma API externa
 */
async function getCoordinatesFromAddress(line1, city, state, postalCode, country) {
    try {
        // Aqui você usaria uma API como Google Maps, OpenStreetMap, etc.
        // Este é apenas um exemplo - você precisará implementar com sua API preferida
        const apiKey = process.env.GEOCODING_API_KEY;
        const address = encodeURIComponent(`${line1}, ${city}, ${state}, ${postalCode}, ${country}`);

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`
        );

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            return {
                latitude: location.lat,
                longitude: location.lng
            };
        }

        throw new Error("Não foi possível obter coordenadas para este endereço");
    } catch (error) {
        console.error("Erro na API de geocodificação:", error);
        throw error;
    }
}

module.exports = {
    createAddress,
    updateAddress,
    getAddressById,
    getUserAddresses,
    deleteAddress
};