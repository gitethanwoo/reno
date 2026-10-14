import { useRef, useState } from "react";
import { Stack, router } from "expo-router";
import { ScrollView, View } from "react-native";
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
import {
  PhotoStrip,
  PhotoViewer,
  galleryPhotos,
} from "@/components/photo-gallery";
import { colors, fonts } from "@/components/theme";
import {
  contractorOf,
  dateLabel,
  latestQuote,
  money,
  paid,
  projectPhotoLimit,
  remaining,
  statusLabel,
  total,
  type Project,
} from "@/domain/model";
import { exportProject } from "@/lib/export-project";
import { useInvite } from "@/features/use-invite";
import { PunchComposer } from "@/components/punch-composer";
import { ThreadComposer } from "@/components/thread-composer";
import { ProjectThread, threadPhotos } from "@/components/project-thread";
import { ActionMenu, MenuAction } from "@/components/action-menu";

export default function ProjectDetail() {
  const { project: p, state, params, role, commit, addPhotos } = useProject();
  // The tab lives in the route so links (a push, "Ask a question") can open
  // the thread on a screen that is already mounted.
  const tab = params.tab ?? "overview";
  const setTab = (next: string) => {
    setFocusRequest(0);
    router.setParams({ tab: next });
  };
  // Counts "Post an update" picks from the menu; each one focuses the composer.
  const [focusRequest, setFocusRequest] = useState(0);
  const task = useTask();
  const photoTask = useTask();
  const [viewing, setViewing] = useState<number | null>(null);
  const [viewingThread, setViewingThread] = useState<number | null>(null);
  // The navigation bar shows the project's name once the big title has
  // scrolled up under it.
  const [titleBottom, setTitleBottom] = useState(0);
  const [titled, setTitled] = useState(false);
  const scroll = useRef<ScrollView>(null);
  // The thread keeps its newest message in view, like Messages, until the
  // person scrolls back through it.
  const stuck = useRef(false);
  const shownTab = useRef<string | null>(null);
  const toBottom = () => {
    if (shownTab.current !== tab) {
      shownTab.current = tab;
      stuck.current = tab === "record";
    }
    if (stuck.current) scroll.current?.scrollToEnd({ animated: false });
  };
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
  const photos = galleryPhotos(p);
  const postedPhotos = threadPhotos(p);
  const record = tab === "record";
  const photosLeft = projectPhotoLimit - p.photos.length;
  const addProjectPhotos = () =>
    photoTask.run(async () => {
      const picked = await addPhotos(photosLeft);
      if (picked.length)
        await commit({
          type: "add-photos",
          projectId: p.id,
          photos: picked,
          at: new Date().toISOString(),
        });
    });
  const postUpdate = () => {
    router.setParams({ tab: "record" });
    setFocusRequest((n) => n + 1);
  };
  // The "+" menu gathers what this side can do right now; each entry follows
  // the same rule as its button further down the screen.
  const actions: MenuAction[] = [
    ...(planning && !homeowner
      ? [
          {
            title: latest ? "Revise quote" : "Write a quote",
            icon: "file" as const,
            onPress: () => go("quote"),
          },
        ]
      : []),
    ...(!homeowner && p.status === "active"
      ? [
          {
            title: "Propose a change",
            icon: "file" as const,
            onPress: () => go("propose"),
          },
        ]
      : []),
    ...(!complete
      ? [
          {
            title: "Post an update",
            icon: "message" as const,
            onPress: postUpdate,
          },
        ]
      : []),
    ...(homeowner && !complete
      ? [
          {
            title: "Add a punch item",
            icon: "tools" as const,
            onPress: () => setTab("punch"),
          },
        ]
      : []),
    ...(homeowner && p.status === "active" && remaining(p) > 0
      ? [
          {
            title: "Log a payment",
            icon: "money" as const,
            onPress: () => go("payment"),
          },
        ]
      : []),
    ...(!complete && photosLeft > 0
      ? [
          {
            title: "Add photos",
            icon: "camera" as const,
            onPress: () => {
              // The new photos show in the overview strip.
              setTab("overview");
              void addProjectPhotos();
            },
          },
        ]
      : []),
  ];
  return (
    <Screen
      scrollRef={scroll}
      keyboard={record}
      scroll={{
        keyboardDismissMode: record ? "on-drag" : undefined,
        onScroll: (e) =>
          setTitled(
            titleBottom > 0 && e.nativeEvent.contentOffset.y > titleBottom,
          ),
        onContentSizeChange: toBottom,
        // The keyboard or an attached photo shortens the view; keep the
        // newest message above the composer.
        onLayout: toBottom,
        onScrollBeginDrag: () => {
          stuck.current = false;
        },
      }}
      footer={
        record && !complete ? (
          <ThreadComposer
            projectId={p.id}
            initial={params.text}
            autoFocus={!!params.text}
            focusRequest={focusRequest}
            onSent={() => {
              stuck.current = true;
            }}
          />
        ) : undefined
      }
    >
      <Stack.Screen
        options={{
          title: titled ? p.title : "",
          headerRight: actions.length
            ? () => <ActionMenu label="Add to this project" actions={actions} />
            : undefined,
        }}
      />
      <View
        style={{ gap: 10 }}
        onLayout={(e) =>
          setTitleBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)
        }
      >
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
          <PhotoStrip
            photos={photos}
            onOpen={setViewing}
            add={
              complete
                ? undefined
                : {
                    onPress: addProjectPhotos,
                    busy: photoTask.busy,
                    left: photosLeft,
                  }
            }
          />
          <ErrorNote error={photoTask.error} />
          {planning && homeowner && !p.isSample && !contractor && (
            <InviteCard p={p} onManage={() => go("invite")} />
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
          {planning && homeowner && !latest && contractor && (
            <Note>
              {contractor.name +
                " has joined this project. Their quote will appear here when they send it."}
            </Note>
          )}
          {members.length > 0 && (
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
      {record && (
        <>
          <ProjectThread
            p={p}
            members={members}
            role={role}
            onOpenPhoto={(id) =>
              setViewingThread(postedPhotos.findIndex((i) => i.id === id))
            }
          />
          {complete && (
            <Note>This project is complete. Its record is read-only.</Note>
          )}
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
          {!p.punch.length && (
            <Empty
              title="Nothing on the list yet."
              text="Add anything that needs attention before the job is finished."
            />
          )}
          {(p.punch.length > 0 || (homeowner && !complete)) && (
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
              {homeowner && !complete && (
                <PunchComposer projectId={p.id} first={!p.punch.length} />
              )}
            </Card>
          )}
        </>
      )}
      <ErrorNote error={task.error} />
      <PhotoViewer
        photos={photos}
        index={viewing}
        onClose={() => setViewing(null)}
      />
      <PhotoViewer
        photos={postedPhotos}
        index={viewingThread}
        onClose={() => setViewingThread(null)}
      />
    </Screen>
  );
}

/** Inviting the contractor is the homeowner's next step on a new project. */
function InviteCard({ p, onManage }: { p: Project; onManage: () => void }) {
  const task = useTask();
  const { expiry, expired, share } = useInvite(p);
  return (
    <Card style={{ backgroundColor: colors.amber }}>
      <Eyebrow>Your move</Eyebrow>
      <Heading small>Invite your contractor</Heading>
      <Copy>
        {expiry
          ? "Link sent · expires " +
            expiry +
            ". It stops working once they join."
          : expired
            ? "Your last link expired. Share a new one."
            : "Text them a link. They’ll see the scope and photos and send a quote here."}
      </Copy>
      <Button
        title={expiry ? "Share link again" : "Share invite link"}
        variant="secondary"
        icon="arrow"
        busy={task.busy}
        onPress={() => task.run(share)}
      />
      {expiry && <Row title="Manage invite" onPress={onManage} />}
      <ErrorNote error={task.error} />
    </Card>
  );
}
