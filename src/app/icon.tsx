import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation - generates a simple "S" mark
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FAFAFA',
          fontWeight: 700,
          fontFamily: 'system-ui',
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
