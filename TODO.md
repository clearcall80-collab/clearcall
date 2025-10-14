# TODO: Replace hardcoded URLs with environment variables

- [x] Update `src/utils/config.ts` to use `import.meta.env.VITE_API_URL`
- [x] Update `src/services/RoomService.tsx` to use `const API_URL = import.meta.env.VITE_API_URL` and replace Supabase URLs with backend API calls
- [x] Update `src/services/AuthService.tsx` to use `const API_URL = import.meta.env.VITE_API_URL`
- [x] Update `src/services/WebRTCService.tsx` to use `const API_URL = import.meta.env.VITE_API_URL`
- [x] Create `.env` file in project root with `VITE_API_URL=https://clearcall-backend.onrender.com`
