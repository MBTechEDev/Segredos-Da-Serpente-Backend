import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components"

type PasswordResetEmailProps = {
    reset_url: string
    email?: string
}

function PasswordResetEmailComponent({
    reset_url,
    email,
}: PasswordResetEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Recupere seu acesso aos Segredos da Serpente</Preview>
            <Tailwind>
                <Body className="bg-[#0a0a0a] my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#262626] rounded-lg my-[40px] mx-auto p-[32px] max-w-[465px] bg-[#0f0f0f]">
                        <Section className="text-center mt-[12px]">
                            {/* Ouro em Hexadecimal para maior compatibilidade */}
                            <Text className="text-[#D4AF37] text-[24px] font-bold tracking-[0.2em] uppercase m-0">
                                Segredos da Serpente
                            </Text>
                        </Section>

                        <Heading className="text-[#D4AF37] text-[20px] font-normal text-center p-0 my-[30px] mx-0 font-serif">
                            Redefinição de Senha
                        </Heading>

                        <Section>
                            <Text className="text-[#e5e5e5] text-[14px] leading-[24px]">
                                Olá{email ? `, ${email}` : ""},
                            </Text>
                            <Text className="text-[#a3a3a3] text-[14px] leading-[24px]">
                                Uma solicitação de redefinição de senha foi feita para sua conta mística.
                                Se você reconhece esta ação, clique no botão abaixo para escolher uma nova credencial.
                            </Text>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#10b981] rounded text-[#000] text-[12px] font-bold no-underline text-center px-6 py-4"
                                href={reset_url}
                                style={{ backgroundColor: '#10b981', color: '#000' }} // Fallback inline
                            >
                                REDEFINIR MINHA SENHA
                            </Button>
                        </Section>

                        <Section>
                            <Text className="text-[#a3a3a3] text-[12px] leading-[24px] m-0">
                                Ou copie e cole este link em seu navegador:
                            </Text>
                            <Link
                                href={reset_url}
                                className="text-[#D4AF37] no-underline text-[12px] break-all"
                            >
                                {reset_url}
                            </Link>
                        </Section>

                        <Hr className="border border-solid border-[#262626] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[18px] text-center italic">
                            "O conhecimento é a chave que abre todas as portas."<br />
                            Este link expira em breve por motivos de segurança. Se não solicitou esta alteração, você pode ignorar este e-mail com segurança.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export const passwordResetEmail = (props: PasswordResetEmailProps) => (
    <PasswordResetEmailComponent {...props} />
)

// Dados de exemplo para ferramentas de preview (como o react-email dev server)
const mockPasswordReset = {
    reset_url: "https://segredosdaserpente.com.br/reset-password?token=sample_token",
    email: "mistico@exemplo.com",
} as PasswordResetEmailProps

export default () => <PasswordResetEmailComponent {...mockPasswordReset} />