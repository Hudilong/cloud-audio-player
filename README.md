# Cloud Audio Player

A **full-stack cloud audio player** built with **Next.js** using **app routes** and **Tailwind CSS**. Users can upload their audio files, create playlists, and listen to their music anywhere.

## Features

- **Audio Upload**: Upload your audio files securely.
- **Playlist Management**: Create and manage playlists.
- **Music Playback**: Stream your music on the go.
- **Responsive Design**: Optimized for all devices.
- **Authentication**: Secure user accounts with authentication.
- **Cloud Storage**: Store audio files efficiently using AWS S3.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) with app routes, [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).
- **Backend**: [Prisma](https://www.prisma.io/) for ORM and database integration.
- **Database**: [Supabase](https://supabase.com/) for database.
- **File Storage**: [AWS S3](https://aws.amazon.com/s3/) for storage.
- **CI/CD**: [Vercel](https://vercel.com/) for deployment and [GitHub Actions](https://github.com/features/actions) for continuous integration.

## Setup and Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/hudilong/cloud-audio-player.git
   cd cloud-audio-player
   ```

2. **Install Dependencies:**

   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables:**

   Create a `.env` file in the root of your project and add the following variables:

   ```env
   DATABASE_URL=your_prisma_database_url
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   BUCKET_ENDPOINT=your_bucket_endpoint # e.g. https://<id>.up.railway.app
   BUCKET_REGION=auto
   BUCKET_NAME=your_bucket_name
   BUCKET_ACCESS_KEY_ID=your_bucket_access_key
   BUCKET_SECRET_ACCESS_KEY=your_bucket_secret_key
   NEXT_PUBLIC_BUCKET_URL=optional_public_base_url
   ```

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

The project is deployed using [Vercel](https://vercel.com/). Push to the `main` branch to trigger deployment. The `dev` branch is used for previews.

## CI/CD Workflow

GitHub Actions is configured to handle CI/CD:

- **Main Branch**: Deploys to production on Vercel.
- **Dev Branch**: Deploys to a Vercel preview environment.
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
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
- [GitHub Actions](https://github.com/features/actions)
- [AWS S3](https://aws.amazon.com/s3/)
