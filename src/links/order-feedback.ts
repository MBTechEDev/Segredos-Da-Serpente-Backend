import { defineLink } from "@medusajs/framework/utils"
import FeedbackModule from "../modules/feedback"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
    OrderModule.linkable.order,
    FeedbackModule.linkable.feedback
)
