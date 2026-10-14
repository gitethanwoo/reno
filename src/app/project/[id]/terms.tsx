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
  Title,
} from "@/components/ui";
export default function Terms() {
  const { project: p } = useProject();
  if (!p)
    return (
      <Screen>
        <Empty title="Project not found." text="Return to Projects." />
      </Screen>
    );
  const question =
    "Can we confirm that the final balance is due after the agreed work and punch list are complete?";
  return (
    <Screen>
      <Badge>Example review</Badge>
      <Title sub="Wording worth a second look before you sign, with a question you can send.">
        Review the terms
      </Title>
      <Card>
        <Eyebrow>Payment timing</Eyebrow>
        <Heading small>When is the balance due?</Heading>
        <Copy>“Balance due on final day of work.”</Copy>
        <Copy tone="muted">
          This wording does not say whether punch-list items must be finished
          first.
        </Copy>
      </Card>
      <Card>
        <Eyebrow>Suggested question</Eyebrow>
        <Copy>{question}</Copy>
        <Button
          title="Edit and send"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/project/[id]/update",
              params: { id: p.id, text: question },
            })
          }
        />
      </Card>
      <Note>
        An example of the planned AI review; reading your actual documents
        isn’t connected yet. Findings are prompts to ask about, not legal
        advice.
      </Note>
    </Screen>
  );
}
