import { SmsSendPage } from "@/components/sms-send-page";

export const metadata = {
  title: "Enviar por SMS",
  robots: { index: false, follow: false },
};

export default function CampanaSmsPage() {
  return <SmsSendPage />;
}
