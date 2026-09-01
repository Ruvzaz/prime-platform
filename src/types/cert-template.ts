export interface CertLayoutConfig {
  showName: boolean;
  nameX: number; // percentage 0 - 100
  nameY: number; // percentage 0 - 100
  nameFontSize: number; // in pixels at 2000x1414 resolution
  nameColor: string; // hex string e.g. "#0f172a"
  nameAlign: "left" | "center" | "right";
  nameFontFamily: string; // e.g. "'Prompt', sans-serif"

  showTeam?: boolean;
  teamX?: number;
  teamY?: number;
  teamFontSize?: number;
  teamColor?: string;
  teamAlign?: "left" | "center" | "right";
  teamMaxWidth?: number; // in pixels at 2000x1414 resolution

  showDate: boolean;
  dateX: number;
  dateY: number;
  dateFontSize: number;
  dateColor: string;
  dateAlign: "left" | "center" | "right";

  showQr: boolean;
  qrX: number;
  qrY: number;
  qrSize: number; // in pixels

  showCode: boolean;
  codeX: number;
  codeY: number;
  codeFontSize: number;
  codeColor: string;
  codeAlign: "left" | "center" | "right";
}

export const DEFAULT_LAYOUT_CONFIG: CertLayoutConfig = {
  showName: true,
  nameX: 50,
  nameY: 48,
  nameFontSize: 56,
  nameColor: "#0f172a",
  nameAlign: "center",
  nameFontFamily: "sans-serif",

  showTeam: false,
  teamX: 50,
  teamY: 58,
  teamFontSize: 32,
  teamColor: "#2563eb",
  teamAlign: "center",
  teamMaxWidth: 650,

  showDate: true,
  dateX: 50,
  dateY: 84,
  dateFontSize: 24,
  dateColor: "#475569",
  dateAlign: "center",

  showQr: true,
  qrX: 82,
  qrY: 78,
  qrSize: 140,

  showCode: true,
  codeX: 50,
  codeY: 78,
  codeFontSize: 20,
  codeColor: "#0f172a",
  codeAlign: "center",
};
