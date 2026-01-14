import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claude City Simulation',
  description: 'Watch an AI governor build and manage a city. Pure simulation - no player interaction.',
};

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
