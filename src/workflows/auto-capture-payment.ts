import { createWorkflow, WorkflowResponse, when } from "@medusajs/framework/workflows-sdk"
import { checkInventoryForCaptureStep } from "./steps/check-inventory-for-capture"
import { capturePaymentWorkflow } from "@medusajs/core-flows"

export const autoCapturePaymentWorkflow = createWorkflow(
    "auto-capture-payment",
    function (input: { payment_id: string }) {

        // Step 1: Checar se o estoque está ok para esse pedido.
        const checkResult = checkInventoryForCaptureStep(input)

        // Step 2: Conditionally executa a captura do pagamento usando o fluxo nativo.
        when(checkResult, (result) => result.can_capture === true)
            .then(() => {
                capturePaymentWorkflow.runAsStep({
                    input: {
                        payment_id: checkResult.payment_id,
                    }
                })
            })

        return new WorkflowResponse(checkResult)
    }
)
