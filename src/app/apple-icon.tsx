import { ImageResponse } from 'next/og';

// Apple touch icon - 180x180
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FAFAFA',
          fontWeight: 700,
          fontFamily: 'system-ui',
          borderRadius: 32,
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    }
  );
}
