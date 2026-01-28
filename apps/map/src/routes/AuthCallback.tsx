// // apps/map/src/routes/AuthCallback.tsx
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { fetchAuthSession } from "aws-amplify/auth";

// export default function AuthCallback() {
//   const nav = useNavigate();
//   useEffect(() => {
//     (async () => {
//       try {
//         await fetchAuthSession();
//         const back = sessionStorage.getItem("postLoginUrl");
//         sessionStorage.removeItem("postLoginUrl");
//         nav(back ? back.replace(location.origin, "") : "/", { replace: true });
//       } catch (e) {
//         console.error(e);
//         nav("/", { replace: true });
//       }
//     })();
//   }, [nav]);
//   return null;
// }
