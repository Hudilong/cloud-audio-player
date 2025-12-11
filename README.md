# Cloud Audio Player

A **full-stack cloud audio player** built with **Next.js** using **app routes** and **Tailwind CSS**. Users can upload their audio files, create playlists, and listen to their music anywhere.

## Features

- **Audio Upload**: Upload your audio files securely.
- **Playlist Management**: Create and manage playlists.
- **Music Playback**: Stream your music on the go.
- **Responsive Design**: Optimized for all devices.
- **Authentication**: Secure user accounts with authentication.
- **Object Storage**: Store audio files in any S3-compatible bucket (MinIO works well for local development).

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) with app routes, [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).
- **Backend**: [Prisma](https://www.prisma.io/) for ORM and database integration.
- **Database**: PostgreSQL (self-hosted or managed).
- **File Storage**: Any S3-compatible object storage (e.g., MinIO locally, your preferred provider in production).
- **CI**: [GitHub Actions](https://github.com/features/actions) for linting and tests.

## Setup and Installation

1. **Clone the Repository:**

   ```bash
   git clone <repo-url> streaming-platform
   cd streaming-platform
   ```

2. **Install Dependencies:**

   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables:**

   Create a `.env` file in the root of your project and add the following variables:

   ```env
   DATABASE_URL=postgresql://user:password@host:port/dbname
   DIRECT_URL=postgresql://user:password@host:port/dbname
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   BUCKET_ENDPOINT=http://localhost:9000 # MinIO example; use your provider endpoint in prod
   BUCKET_REGION=auto
   BUCKET_NAME=your_bucket_name
   BUCKET_ACCESS_KEY_ID=your_bucket_access_key
   BUCKET_SECRET_ACCESS_KEY=your_bucket_secret_key
   NEXT_PUBLIC_BUCKET_URL=http://localhost:9000/your_bucket_name # Optional public base URL
   ```

   Use any PostgreSQL instance for `DATABASE_URL`. Any S3-compatible service works for object storage; MinIO is an easy option for local development.

4. **Run Database Migrations:**

   ```bash
   pnpm prisma migrate dev
   ```

5. **Start the Development Server:**

   ```bash
   pnpm dev
   ```

6. **Access the App:**

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment examples

- Copy `.env.example` to `.env` and fill in secrets. `NEXT_PUBLIC_BUCKET_URL` should point to the public HTTP base for your bucket (MinIO: `http://localhost:9000/streaming-bucket`).
- For Railway or other S3-compatible storage, reuse the same bucket for audio and images; the app signs requests per object.

### Seeding and demo tracks

- `pnpm seed` creates a dev user (`SEED_USER_EMAIL` / `SEED_USER_PASSWORD`) and seeds `SEED_TRACK_COUNT` placeholder tracks that point to `SEED_AUDIO_S3_KEY`.
- To ship demo content for new accounts, set `DEMO_TRACK_1_KEY` / `DEMO_TRACK_2_KEY` (or a `DEMO_TRACKS` JSON array) to real object keys already uploaded to your bucket. Blurhash and cover URLs are optional but recommended.

### Testing

- Unit/integration (includes the happy-path upload → reorder → resume flow): `pnpm test`
- Lint: `pnpm lint`
- Type/lint formatting: `pnpm check`

### Code organization

- `app/`: routes/layouts and UI entry points; keep route handlers thin (auth/validation/response shaping) and delegate to services.
- `components/`: shared UI components (mark client components with `'use client'` where needed).
- `services/`: domain logic (playback, playlist reorder, track CRUD, storage helpers). Prisma calls live here so routes stay light.
- `utils/`: cross-cutting helpers (validation, blurhash/image processing, auth options).
- `types/`: shared type exports.

This keeps a simple “route → service → Prisma” flow that’s easy to test and evolve.

## Deployment

Build and run wherever you can host a Next.js app (container platform, VM, or managed Node host):

```bash
pnpm build
pnpm start
```

Provide the same environment variables used in development to your hosting platform.

## CI/CD Workflow

GitHub Actions is configured to handle CI:

- **Main Branch**: Runs linting and tests on push.
- **Dev Branch**: Runs linting and tests on pull requests.
- **Feature Branches**: Based on `dev` for isolated feature development.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [GitHub Actions](https://github.com/features/actions)
- [MinIO](https://min.io/) / S3-compatible storage providers
