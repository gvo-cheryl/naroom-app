// app.json은 정적 기본값을 담고, 이 파일은 빌드 시점 환경변수가 필요한 값(카카오 Native App Key)만
// 얹는다. app.json을 통째로 다시 쓰지 않기 위한 최소 확장.
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
    ],
  };
};
