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
