import QRCode from 'qrcode';

const DEFAULT_QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 1,
  width: 512,
} as const;

export async function renderQRtoPNG(value: string) {
  return QRCode.toBuffer(value, {
    ...DEFAULT_QR_OPTIONS,
    type: 'png',
  });
}

export async function renderQRtoSVG(value: string) {
  return QRCode.toString(value, {
    ...DEFAULT_QR_OPTIONS,
    type: 'svg',
  });
}
