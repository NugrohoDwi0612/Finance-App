/**
 * 1. Cek Apakah HP Pengguna Memiliki Sensor Fisik (Face ID / Fingerprint / Touch ID)
 */
export async function checkDeviceBiometrics(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * 2. Memicu Popup NATIVE Face ID / Fingerprint untuk Mendaftarkan Sensor
 */
export async function registerBiometricSensor(userName: string): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "CatatUang Finansial",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: userName || "user",
          displayName: userName || "Pengguna CatatUang",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256 (iPhone FaceID / TouchID)
          { alg: -257, type: "public-key" }, // RS256 (Android Fingerprint / Windows Hello)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Wajib sensor fisik bawaan HP
          userVerification: "required",
        },
        timeout: 60000,
      },
    });

    return !!credential;
  } catch (err: any) {
    console.error("Gagal mendaftarkan biometrik:", err);
    return false;
  }
}

/**
 * 3. Memicu Popup Scan Biometrik saat Membuka Kunci Aplikasi
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch (err: any) {
    console.error("Gagal autentikasi biometrik:", err);
    return false;
  }
}