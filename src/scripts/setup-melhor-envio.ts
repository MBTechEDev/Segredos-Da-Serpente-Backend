import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function setupMelhorEnvio({ container }) {
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
    const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
    const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);

    const LOCATION_NAME = "Tupi 1";
    const PROVIDER_ID = "melhor-envio";
    const SET_NAME = "Entrega Melhor Envio";

    try {
        // 1. Tentar encontrar ou criar o Stock Location
        let [locations] = await stockLocationModule.listStockLocations({
            name: LOCATION_NAME
        });

        let location;

        if (!locations || locations.length === 0) {
            location = await stockLocationModule.createStockLocations({
                name: LOCATION_NAME,
                address: {
                    address_1: "Rua Exemplo",
                    city: "Sua Cidade",
                    country_code: "br",
                    postal_code: "00000-000"
                }
            });
        } else {
            location = locations[0];
        }

        // 2. Vincular Sales Channel (Garante visibilidade no checkout)
        const [salesChannels] = await salesChannelModule.listSalesChannels({
            name: "Default Sales Channel"
        });

        if (salesChannels && salesChannels.length > 0) {
            await remoteLink.create([{
                [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannels[0].id },
                [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
            }]);
        }

        // 3. Configurar Fulfillment Set
        let [fSets] = await fulfillmentModule.listFulfillmentSets(
            { name: SET_NAME },
            { relations: ["service_zones", "service_zones.geo_zones"] }
        );

        let fSet = fSets?.[0];

        if (!fSet) {
            fSet = await fulfillmentModule.createFulfillmentSets({
                name: SET_NAME,
                type: "shipping",
                service_zones: [
                    {
                        name: "Brasil",
                        geo_zones: [{ country_code: "br", type: "country" }],
                    },
                ],
            });
        }

        // 4. Vincular Localização ao Set e Provider
        await remoteLink.create([
            {
                [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
                [Modules.FULFILLMENT]: { fulfillment_set_id: fSet.id },
            },
            {
                [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
                [Modules.FULFILLMENT]: { fulfillment_provider_id: PROVIDER_ID },
            }
        ]);

        // 5. Configurar Opções de Frete
        const serviceZone = fSet.service_zones[0];
        const [profiles] = await fulfillmentModule.listShippingProfiles({ type: "default" });
        const profile = profiles?.[0];

        const options = [
            { name: "Melhor Envio PAC", id_me: "1" },
            { name: "Melhor Envio SEDEX", id_me: "2" }
        ];

        for (const opt of options) {
            const [existing] = await fulfillmentModule.listShippingOptions({ name: opt.name });

            if (!existing || existing.length === 0) {
                await fulfillmentModule.createShippingOptions({
                    name: opt.name,
                    service_zone_id: serviceZone.id,
                    shipping_profile_id: profile.id,
                    provider_id: PROVIDER_ID,
                    price_type: "calculated",
                    data: { id: opt.id_me },
                    type: { label: opt.name, code: opt.name.toLowerCase().replace(/\s/g, "-") }
                });
            }
        }

    } catch (error) {
        console.error("🔥 Erro detalhado:", error);
    }
}