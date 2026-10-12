import nextVitals from "eslint-config-next/core-web-vitals";
const config = [...nextVitals, { ignores: [".next/**", "playwright-report/**", "test-results/**", ".archive/**", "public/landing/**", "video/**"], rules: { "react-hooks/set-state-in-effect": "off" } }];
export default config;
