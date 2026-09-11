import Hero from "@/components/home/Hero";
import ArchiveStats from "@/components/home/ArchiveStats";
import RecordsStrip from "@/components/home/RecordsStrip";
import LatestDiscoveries from "@/components/home/LatestDiscoveries";

export default function Home() {
  return (
    <main>
      <Hero />
      <ArchiveStats />
      <RecordsStrip />
      <LatestDiscoveries />
    </main>
  );
}
