import { model } from "@medusajs/framework/utils"

export const Feedback = model.define("feedback", {
    id: model.id().primaryKey(),

    // Etapa 1: Transporte
    transport_rating: model.number().nullable(),
    transport_comment: model.text().nullable(),

    // Etapa 2: Atendimento
    service_rating: model.number().nullable(),
    service_comment: model.text().nullable(),

    // Etapa 3: Produto
    product_rating: model.number().nullable(),
    product_comment: model.text().nullable(),

    // Moderação e Status
    is_published: model.boolean().default(false),
    status: model.enum(["draft", "partial", "completed"]).default("draft"),

    // Relacionamentos
    images: model.hasMany(() => FeedbackImage),
    metadata: model.json().nullable(),
})

export const FeedbackImage = model.define("feedback_image", {
    id: model.id().primaryKey(),
    url: model.text(),
    file_id: model.text(),
    feedback: model.belongsTo(() => Feedback, {
        mappedBy: "images",
    }),
})
