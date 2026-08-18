// app.json은 정적 기본값을 담고, 이 파일은 빌드 시점 환경변수가 필요한 값(카카오 Native App Key,
// Google iOS URL scheme)만 얹는다. app.json을 통째로 다시 쓰지 않기 위한 최소 확장.
module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      "expo-font",
      "expo-web-browser",
      [
        "@react-native-seoul/kakao-login",
        {
          kakaoAppKey: process.env.KAKAO_NATIVE_APP_KEY ?? "",
        },
      ],
      // 카카오 플러그인과 달리 이 플러그인은 iosUrlScheme이 빈 문자열이면 config 평가 자체가 예외를
      // 던진다 - Google Cloud Console에서 실제 iOS OAuth Client ID를 발급받기 전까지는 플러그인을 통째로
      // 빼서, GOOGLE_IOS_URL_SCHEME 미설정 상태에서도 expo start/doctor 등이 정상 동작하게 한다.
      ...(process.env.GOOGLE_IOS_URL_SCHEME
        ? [
            [
              "@react-native-google-signin/google-signin",
              { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME },
            ],
          ]
        : []),
    ],
  };
};
