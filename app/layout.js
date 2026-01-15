import './globals.css';

export const metadata = {
  title: 'نظام إدارة التوزيع',
  description: 'نظام إدارة نقاط التوزيع',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
