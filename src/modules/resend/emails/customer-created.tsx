import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from "@react-email/components"

type CustomerCreatedEmailProps = {
    customer: {
        first_name?: string
        last_name?: string
        email: string
    }
}

function CustomerCreatedEmailComponent({ customer }: CustomerCreatedEmailProps) {
    const nome = customer.first_name || "Buscador"

    return (
        <Html>
            <Head />
            <Preview>Sua jornada nos Segredos da Serpente começou.</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#10b981", // Emerald
                                gold: "#D4AF37",
                                dark: "#0a0a0a",
                            },
                        },
                    },
                }}
            >
                <Body className="bg-[#050505] my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#1a1a1a] rounded my-[40px] mx-auto max-w-[600px] overflow-hidden">

                        <Section className="bg-dark p-[40px] text-center border-b border-[#D4AF37]/30">
                            <Heading className="text-gold text-[28px] font-serif m-0 p-0 uppercase tracking-[4px]">
                                Segredos da Serpente
                            </Heading>
                            <Text className="text-brand text-[12px] tracking-[2px] uppercase mt-2">
                                Bem-vindo(a) ao Círculo
                            </Text>
                        </Section>

                        <Section className="px-[40px] py-[30px] bg-dark">
                            <Heading className="text-white text-[24px] font-bold text-center">
                                Saudações, {nome}.
                            </Heading>
                            <Text className="text-gray-400 text-[16px] leading-[24px] text-center mt-4">
                                Os véus se ergueram e você adentrou nosso círculo confidencial. Agora, você faz parte de um espaço dedicado à evolução e ao mistério.
                            </Text>
                            <Text className="text-gray-400 text-[16px] leading-[24px] text-center mt-4">
                                Mantenha seu login {customer.email} seguro. O limiar está aberto para você explorar novos encantamentos, saberes e ferramentas ritualísticas.
                            </Text>

                            <Section className="text-center mt-[32px] mb-[32px]">
                                <Link
                                    href="http://localhost:3000"
                                    className="bg-brand text-white px-[28px] py-[14px] rounded-md font-bold text-[16px] no-underline tracking-wide border border-[#10b981]"
                                >
                                    Retornar ao Portal
                                </Link>
                            </Section>
                        </Section>

                        <Section className="bg-dark p-[40px] text-center border-t border-white/5">
                            <Text className="text-gray-500 text-[12px] leading-[20px]">
                                Dúvidas sobre sua jornada? Fale com <Link href="mailto:suporte@segredosdaserpente.com.br" className="text-brand underline">suporte@segredosdaserpente.com.br</Link>
                            </Text>
                            <Text className="text-gray-600 text-[10px] mt-8">
                                © {new Date().getFullYear()} Segredos da Serpente. Todos os direitos reservados.
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

export const customerCreatedEmail = (props: CustomerCreatedEmailProps) => (
    <CustomerCreatedEmailComponent {...props} />
)

const mockCustomer = {
    customer: {
        first_name: "Adepto",
        email: "adepto@oculto.com"
    }
}

// @ts-ignore
export default () => <CustomerCreatedEmailComponent {...mockCustomer} />
