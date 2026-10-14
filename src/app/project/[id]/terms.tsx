import { router } from "expo-router";
import { useProject } from "@/features/use-project";
import {
  Badge,
  Button,
  Card,
  Copy,
  Empty,
  Eyebrow,
  Heading,
  Note,
  Screen,
} from "@/components/ui";
export default function Terms() {
  const { project: p } = useProject();
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  return (
    <Screen>
      <Badge>Example term review</Badge>
      <Heading>Know what you’re{"\n"}agreeing to.</Heading>
      <Copy tone="muted">A clear question is a good place to start.</Copy>
      <Card>
        <Eyebrow>Payment timing · Example finding</Eyebrow>
        <Heading small>When is the balance due?</Heading>
        <Copy>“Balance due on final day of work.”</Copy>
        <Copy tone="muted">
          This wording does not say whether punch-list items must be finished
          first.
        </Copy>
      </Card>
      <Card>
        <Eyebrow>A question worth asking</Eyebrow>
        <Copy>
          Can we confirm that the final balance is due after the agreed work and
          punch list are complete?
        </Copy>
        <Button
          title="Write a project question"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/project/[id]/update",
              params: { id: p.id },
            })
          }
        />
      </Card>
      <Note>
        This illustrates the planned AI review. Document analysis is not
        connected yet. Findings are review prompts, not legal advice.
      </Note>
    </Screen>
  );
}
