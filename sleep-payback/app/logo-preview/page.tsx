"use client";

export default function LogoPreview() {
  return (
    <div style={{ padding: "40px", background: "#f0f0f0", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px" }}>로고 미리보기</h1>
      
      <div style={{ display: "grid", gap: "30px" }}>
        
        <div style={{ background: "white", padding: "60px", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#999", marginBottom: "20px" }}>Option 1</p>
          <div>
            <div style={{ fontSize: "80px", fontWeight: "900", color: "#4a4a4a", lineHeight: "1" }}>
              sleep
            </div>
            <div style={{ fontSize: "50px", fontWeight: "900", color: "#6a6a6a", lineHeight: "1" }}>
              debt
            </div>
            <div style={{ fontSize: "75px", fontWeight: "900", color: "#4a4a4a", lineHeight: "1" }}>
              manager
            </div>
          </div>
        </div>

        <div style={{ background: "white", padding: "60px", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#999", marginBottom: "20px" }}>Option 2</p>
          <div>
            <div style={{ fontSize: "85px", fontWeight: "900", color: "#3a3a3a", lineHeight: "0.9" }}>
              sleep
            </div>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#5a5a5a", lineHeight: "0.9" }}>
              debt
            </div>
            <div style={{ fontSize: "80px", fontWeight: "900", color: "#3a3a3a", lineHeight: "0.9" }}>
              manager
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
