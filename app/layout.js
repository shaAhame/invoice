export const metadata = {
  title: "iDealz - Tax Invoice",
  description: "Tax invoice generator for iDealz stores",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", background: "#f2f4f7" }}>
        {children}
      </body>
    </html>
  );
}
