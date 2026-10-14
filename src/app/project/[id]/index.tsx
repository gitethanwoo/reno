import { useState } from "react";
import { Stack, router } from "expo-router";
import { View } from "react-native";
import { Image } from "expo-image";
import { useProject } from "@/features/use-project";
import {
  Badge,
  Button,
  Card,
  Copy,
  Divider,
  Empty,
  ErrorNote,
  Eyebrow,
  Heading,
  Note,
  Row,
  Screen,
  Segments,
  useTask,
} from "@/components/ui";
import { kitchen } from "@/components/project-card";
import { colors, fonts } from "@/components/theme";
import {
  dateLabel,
  money,
  paid,
  remaining,
  statusLabel,
  total,
} from "@/domain/model";
import { exportProject } from "@/lib/export-project";
import { Icon } from "@/components/icon";

export default function ProjectDetail() {
  const { project: p, state, params } = useProject();
  const [tab, setTab] = useState(params.tab ?? "overview");
  const task = useTask();
  if (!p)
    return (
      <Screen>
        <Empty
          title="Project not found."
          text="Return to Projects to find your notebook."
        />
      </Screen>
    );
  const go = (
    screen:
      | "change"
      | "payment"
      | "update"
      | "punch"
      | "quotes"
      | "terms"
      | "propose"
      | "complete",
    extras = {},
  ) =>
    router.push({
      pathname: `/project/[id]/${screen}` as const,
      params: { id: p.id, ...extras },
    });
  const homeowner = state.role === "homeowner",
    complete = p.status === "completed";
  const pending = p.changes.filter((c) => c.status === "pending");
  return (
    <Screen>
      <Stack.Screen options={{ title: p.title }} />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Badge>{statusLabel(p)}</Badge>
          {p.isSample && <Badge warm>Sample project</Badge>}
        </View>
        <Heading>{p.title}</Heading>
        <Copy tone="muted">
          {p.quote?.company ?? "Your next good idea"} · {p.zip}
        </Copy>
      </View>
      <Segments
        value={tab}
        onChange={setTab}
        options={[
          { label: "Overview", value: "overview" },
          { label: "Record", value: "record" },
          { label: "Money", value: "money" },
          { label: "Punch list", value: "punch" },
        ]}
      />
      {tab === "overview" && (
        <>
          {(p.isSample || p.photos[0]) && (
            <Image
              source={p.photos[0]?.uri ?? kitchen}
              style={{ width: "100%", height: 195, borderRadius: 14 }}
              contentFit="cover"
              accessibilityLabel="Project inspiration"
            />
          )}
          {pending.map((c) => (
            <Card key={c.id} style={{ backgroundColor: colors.amber }}>
              <Eyebrow>
                {homeowner
                  ? "Your decision, next"
                  : "Waiting for the homeowner"}
              </Eyebrow>
              <Heading small>{c.title}</Heading>
              <Copy>
                +{money(c.cents)} · +{c.days} day{c.days === 1 ? "" : "s"}
              </Copy>
              <Button
                title="View change"
                variant="secondary"
                icon="arrow"
                onPress={() => go("change", { changeId: c.id })}
              />
            </Card>
          ))}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Card style={{ flex: 1 }}>
              <Copy tone="muted" style={{ fontSize: 12 }}>
                Approved total
              </Copy>
              <Copy style={{ fontFamily: fonts.bold, fontSize: 25 }}>
                {p.quote ? money(total(p)) : "—"}
              </Copy>
            </Card>
            <Card style={{ flex: 1 }}>
              <Copy tone="muted" style={{ fontSize: 12 }}>
                Finish date
              </Copy>
              <Copy style={{ fontFamily: fonts.bold, fontSize: 25 }}>
                {p.finish ? dateLabel(p.finish) : "TBD"}
              </Copy>
            </Card>
          </View>
          <View style={{ gap: 10 }}>
            <Heading small>The plan</Heading>
            <Copy>{p.scope}</Copy>
            <Copy tone="muted">
              {p.area ? p.area + " sq ft · " : ""}
              {p.timing}
            </Copy>
          </View>
          {p.status === "planning" && (
            <Note>
              Your project is saved. Contractor matching and live estimates are
              coming next; nothing has been sent to a contractor.
            </Note>
          )}
          <Card>
            <Row
              title={p.quotes.length ? "Quote & contractor" : "Quotes"}
              detail={
                p.quotes.length
                  ? p.quotes.length + " quotes on record"
                  : "No quotes yet"
              }
              icon="file"
              onPress={() => go("quotes")}
            />
            {p.quote && (
              <Row
                title="Review the terms"
                detail="Read the sample findings"
                icon="spark"
                onPress={() => go("terms")}
              />
            )}
            <Row
              title="Export project record"
              detail="Share a text copy of this notebook"
              icon="download"
              onPress={() => task.run(() => exportProject(p))}
            />
          </Card>
          {!complete && (
            <Button
              title="Post an update"
              icon="plus"
              onPress={() => go("update")}
            />
          )}
          {!complete && !homeowner && p.status === "active" && (
            <Button
              title="Propose a change"
              variant="secondary"
              onPress={() => go("propose")}
            />
          )}
          {!complete && homeowner && p.status === "active" && (
            <Button
              title="Finish this project"
              variant="quiet"
              onPress={() => go("complete")}
            />
          )}
          {complete && (
            <Note>
              Your finished project record is kept here, with the quote,
              decisions, payments, and punch list together.
            </Note>
          )}
        </>
      )}
      {tab === "record" && (
        <>
          <Heading small>One place for the whole story.</Heading>
          {!complete && (
            <Button
              title="Post an update"
              icon="plus"
              onPress={() => go("update")}
            />
          )}
          {p.events.map((event) => (
            <View key={event.id} style={{ flexDirection: "row", gap: 14 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: colors.sage,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  size={17}
                  name={
                    event.kind === "payment"
                      ? "money"
                      : event.kind === "change"
                        ? "file"
                        : event.kind === "punch"
                          ? "check"
                          : "message"
                  }
                />
              </View>
              <View
                style={{
                  flex: 1,
                  gap: 7,
                  paddingBottom: 16,
                  borderBottomColor: colors.line,
                  borderBottomWidth: 1,
                }}
              >
                <Copy style={{ fontFamily: fonts.bold, fontSize: 13 }}>
                  {event.author}{" "}
                  <Copy tone="muted" style={{ fontSize: 12 }}>
                    {" "}
                    · {dateLabel(event.at)}
                  </Copy>
                </Copy>
                <Copy>{event.text}</Copy>
                {event.photo && (
                  <Image
                    source={event.photo.uri}
                    accessibilityLabel={event.photo.name}
                    style={{ width: "100%", height: 180, borderRadius: 10 }}
                    contentFit="cover"
                  />
                )}
              </View>
            </View>
          ))}
        </>
      )}
      {tab === "money" && (
        <>
          <Heading>Every dollar,{"\n"}visible.</Heading>
          <Card>
            <Eyebrow>Approved total</Eyebrow>
            <Heading>{money(total(p))}</Heading>
            <Row title="Original quote" detail={money(p.quote?.cents ?? 0)} />
            <Row
              title="Approved changes"
              detail={"+" + money(total(p) - (p.quote?.cents ?? 0))}
            />
            <Divider />
            <View style={{ flexDirection: "row", gap: 20 }}>
              <View style={{ flex: 1 }}>
                <Copy tone="muted">Logged paid</Copy>
                <Heading small>{money(paid(p))}</Heading>
              </View>
              <View style={{ flex: 1 }}>
                <Copy tone="muted">Remaining</Copy>
                <Heading small>{money(remaining(p))}</Heading>
              </View>
            </View>
          </Card>
          <Heading small>Payment record</Heading>
          {p.payments.length ? (
            p.payments.map((payment) => (
              <Card key={payment.id}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <Copy style={{ fontFamily: fonts.bold }}>
                    {payment.note || "Payment"}
                  </Copy>
                  <Copy style={{ fontFamily: fonts.bold }}>
                    {money(payment.cents)}
                  </Copy>
                </View>
                <Copy tone="muted" style={{ fontSize: 13 }}>
                  {dateLabel(payment.date)} · {payment.method} · Logged by you
                </Copy>
              </Card>
            ))
          ) : (
            <Empty
              title="A clean ledger."
              text="Log payments after you choose your contractor."
            />
          )}
          <Note>
            Payments are recorded here. Money is paid directly to your
            contractor outside Reno.
          </Note>
          {homeowner && p.status === "active" && remaining(p) > 0 && (
            <Button
              title="Log a payment"
              icon="plus"
              onPress={() => go("payment")}
            />
          )}
        </>
      )}
      {tab === "punch" && (
        <>
          <Heading>The final{"\n"}little things.</Heading>
          <Copy tone="muted">
            {p.punch.filter((i) => i.status === "resolved").length} of{" "}
            {p.punch.length} items resolved
          </Copy>
          {p.punch.map((item) => (
            <Card key={item.id}>
              <Badge warm={item.status !== "resolved"}>
                {item.status === "review"
                  ? "Ready for your review"
                  : item.status === "resolved"
                    ? "Resolved"
                    : "Open"}
              </Badge>
              <Heading small>{item.title}</Heading>
              <Copy tone="muted">{item.note}</Copy>
              <Button
                title="View item"
                variant="secondary"
                onPress={() => go("punch", { itemId: item.id })}
              />
            </Card>
          ))}
          {!p.punch.length && (
            <Empty
              title="Nothing on the list yet."
              text="Add the details that need attention before the job is finished."
            />
          )}
          {homeowner && !complete && (
            <Button
              title="Add punch item"
              icon="plus"
              onPress={() => go("punch")}
            />
          )}
        </>
      )}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
