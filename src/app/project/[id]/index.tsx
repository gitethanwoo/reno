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
  LineItem,
  Note,
  Row,
  Screen,
  Tabs,
  plural,
  useTask,
} from "@/components/ui";
import { kitchen } from "@/components/project-card";
import { colors, fonts } from "@/components/theme";
import {
  contractorOf,
  dateLabel,
  latestQuote,
  money,
  paid,
  remaining,
  statusLabel,
  total,
} from "@/domain/model";
import { exportProject } from "@/lib/export-project";
import { expiresIn } from "@/lib/invite";
import { Icon } from "@/components/icon";

export default function ProjectDetail() {
  const { project: p, state, params, role } = useProject();
  const [tab, setTab] = useState(params.tab ?? "overview");
  const [now] = useState(() => Date.now());
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
  const inviteExpiry = p.invite ? expiresIn(p.invite.expiresAt, now) : null;
  const go = (
    screen:
      | "change"
      | "payment"
      | "update"
      | "punch"
      | "quotes"
      | "terms"
      | "propose"
      | "complete"
      | "invite"
      | "quote",
    extras = {},
  ) =>
    router.push({
      pathname: `/project/[id]/${screen}` as const,
      params: { id: p.id, ...extras },
    });
  const homeowner = role === "homeowner",
    complete = p.status === "completed",
    planning = p.status === "planning";
  const contractor = contractorOf(p);
  const latest = latestQuote(p);
  // The sample notebook has no server membership, so name its two sides here.
  const members =
    p.members ??
    (p.isSample
      ? [
          { name: state.name || "You", role: "homeowner" as const },
          { name: "Alex · Coastal Tile", role: "contractor" as const },
        ]
      : []);
  const pending = p.changes.filter((c) => c.status === "pending");
  const openPunch = p.punch.filter((i) => i.status !== "resolved");
  const pendingCents = pending.reduce((sum, c) => sum + c.cents, 0);
  return (
    <Screen>
      <Stack.Screen options={{ title: "" }} />
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Badge>{statusLabel(p)}</Badge>
          {p.isSample && <Badge warm>Sample project</Badge>}
        </View>
        <Heading>{p.title}</Heading>
        <Copy tone="muted">
          {p.quote?.company ?? p.type} · {p.zip}
        </Copy>
      </View>
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { label: "Overview", value: "overview", count: pending.length },
          { label: "Record", value: "record" },
          { label: "Money", value: "money" },
          { label: "Punch list", value: "punch", count: openPunch.length },
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
                +{money(c.cents)} · +{plural(c.days, "day")}
              </Copy>
              <Button
                title={homeowner ? "Review change" : "View change"}
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
              <Copy
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontFamily: fonts.bold, fontSize: 22 }}
              >
                {p.quote ? money(total(p)) : "—"}
              </Copy>
            </Card>
            <Card style={{ flex: 1 }}>
              <Copy tone="muted" style={{ fontSize: 12 }}>
                Finish date
              </Copy>
              <Copy
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontFamily: fonts.bold, fontSize: 22 }}
              >
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
          {planning && !homeowner && (
            <Card style={{ backgroundColor: colors.amber }}>
              <Eyebrow>Your move</Eyebrow>
              <Heading small>
                {latest ? "Send a revised quote" : "Send your quote"}
              </Heading>
              <Copy>
                {latest
                  ? "Your quote for " +
                    money(latest.cents) +
                    " is with the homeowner. Send a new version if the scope or price changed."
                  : "List the work line by line, with your deposit, start date and schedule."}
              </Copy>
              <Button
                title={latest ? "Revise quote" : "Write a quote"}
                variant="secondary"
                icon="arrow"
                onPress={() => go("quote")}
              />
            </Card>
          )}
          {planning && homeowner && latest && (
            <Card style={{ backgroundColor: colors.amber }}>
              <Eyebrow>Your decision, next</Eyebrow>
              <Heading small>A quote is ready</Heading>
              <Copy>
                {latest.company} · {money(latest.cents)} ·{" "}
                {plural(latest.durationDays, "day")}
              </Copy>
              <Button
                title="Review quote"
                variant="secondary"
                icon="arrow"
                onPress={() => go("quotes")}
              />
            </Card>
          )}
          {planning && homeowner && !latest && (
            <Note>
              {contractor
                ? contractor.name +
                  " has joined this project. Their quote will appear here when they send it."
                : "Your project is saved. Invite your contractor so they can see the scope and send a quote here. Nothing is shared until you do."}
            </Note>
          )}
          {(members.length > 0 || (homeowner && !p.isSample)) && (
            <Card style={{ gap: 0, paddingVertical: 4 }}>
              {members.map((m, i) => (
                <View
                  key={m.role + m.name}
                  style={{
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.line,
                  }}
                >
                  <Row
                    title={m.name}
                    detail={m.role === "homeowner" ? "Homeowner" : "Contractor"}
                    icon={m.role === "homeowner" ? "home" : "tools"}
                  />
                </View>
              ))}
              {homeowner && !p.isSample && !contractor && !complete && (
                <View
                  style={{
                    borderTopWidth: members.length ? 1 : 0,
                    borderTopColor: colors.line,
                  }}
                >
                  <Row
                    title="Invite your contractor"
                    detail={
                      inviteExpiry
                        ? "Link sent · expires " + inviteExpiry
                        : p.invite
                          ? "Your link expired · send a new one"
                          : "Text them a link to join"
                    }
                    icon="user"
                    onPress={() => go("invite")}
                  />
                </View>
              )}
            </Card>
          )}
          <Card>
            <Row
              title={p.quotes.length ? "Quote & contractor" : "Quotes"}
              detail={
                p.quotes.length
                  ? plural(p.quotes.length, "quote") + " on record"
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
          {!complete && !homeowner && p.status === "active" && (
            <Button
              title="Propose a change"
              icon="plus"
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
          <Card>
            <LineItem
              label="Original quote"
              value={p.quote ? money(p.quote.cents) : "—"}
            />
            <LineItem
              label="Approved changes"
              value={"+" + money(total(p) - (p.quote?.cents ?? 0))}
            />
            <Divider />
            <LineItem label="Approved total" value={money(total(p))} strong />
            <LineItem label="Logged as paid" value={"−" + money(paid(p))} />
            <Divider />
            <LineItem label="Remaining" value={money(remaining(p))} strong />
          </Card>
          {pendingCents > 0 && (
            <Note warning>
              {money(pendingCents)} in proposed changes is not included above
              until it is approved.
            </Note>
          )}
          <View style={{ gap: 4 }}>
            <Heading small>Payments</Heading>
            <Copy tone="muted" style={{ fontSize: 14 }}>
              Logged by you. Money is paid to your contractor outside Reno.
            </Copy>
          </View>
          {p.payments.length ? (
            <Card style={{ gap: 0, paddingVertical: 6 }}>
              {p.payments.map((payment, i) => (
                <View
                  key={payment.id}
                  style={{
                    paddingVertical: 12,
                    gap: 2,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.line,
                  }}
                >
                  <LineItem
                    label={payment.note || "Payment"}
                    value={money(payment.cents)}
                    strong
                  />
                  <Copy tone="muted" style={{ fontSize: 13 }}>
                    {dateLabel(payment.date)} · {payment.method}
                  </Copy>
                </View>
              ))}
            </Card>
          ) : (
            <Empty
              title="No payments logged."
              text="Log each payment after you make it, with the date and method."
            />
          )}
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
          {p.punch.length ? (
            <View style={{ gap: 10 }}>
              <Copy tone="muted">
                {p.punch.length - openPunch.length} of {p.punch.length} resolved
              </Copy>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.line,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 6,
                    width: `${((p.punch.length - openPunch.length) / p.punch.length) * 100}%`,
                    backgroundColor: colors.ink,
                  }}
                />
              </View>
            </View>
          ) : null}
          {p.punch.length ? (
            <Card style={{ gap: 0, paddingVertical: 4 }}>
              {p.punch.map((item, i) => (
                <View
                  key={item.id}
                  style={{
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.line,
                  }}
                >
                  <Row
                    title={item.title}
                    detail={
                      item.status === "review"
                        ? homeowner
                          ? "Fix submitted · Ready for your review"
                          : "Fix submitted · Waiting for homeowner"
                        : item.status === "resolved"
                          ? "Resolved"
                          : homeowner
                            ? "Open · Waiting for a fix"
                            : "Open · Needs your fix"
                    }
                    icon={item.status === "resolved" ? "check" : "tools"}
                    onPress={() => go("punch", { itemId: item.id })}
                  />
                </View>
              ))}
            </Card>
          ) : (
            <Empty
              title="Nothing on the list yet."
              text="Add anything that needs attention before the job is finished."
            />
          )}
          {homeowner && !complete && (
            <Button
              title="Add punch item"
              icon="plus"
              variant={p.punch.length ? "secondary" : "primary"}
              onPress={() => go("punch")}
            />
          )}
        </>
      )}
      <ErrorNote error={task.error} />
    </Screen>
  );
}
