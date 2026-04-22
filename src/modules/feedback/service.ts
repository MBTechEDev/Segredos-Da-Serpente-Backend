import { MedusaService } from "@medusajs/framework/utils"
import { Feedback, FeedbackImage } from "./models/feedback"

export default class FeedbackModuleService extends MedusaService({
    Feedback,
    FeedbackImage,
}) { }
