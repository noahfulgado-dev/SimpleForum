import random
import re
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone
from faker import Faker

from accounts.models import Follow
from forum.cache import clear_topic_cache
from forum.models import Reply, Topic
from interactions.models import Bookmark, Likes, Share

User = get_user_model()

USER_PREFIX = "seed_"
DEMO_PASSWORD = "demo12345!"
USER_COUNT = 10
IMAGE_RATIO = 0.6
SHARE_RATIO = 0.1
MAX_REPLIES = 8

GENRES = [
    "lo-fi", "jazz", "ambient", "indie rock", "shoegaze", "classical", "electronic",
    "hip-hop", "bossa nova", "folk", "soul", "synthwave", "post-rock", "R&B",
    "house", "reggae", "trip-hop", "blues", "dream pop", "neo-soul", "math rock",
    "drum and bass", "country", "metal", "grunge",
]

MOODS = [
    "rainy day", "late night", "road trip", "study session", "morning coffee",
    "sunset drive", "winter cozy", "summer evening", "deep focus", "wind-down",
    "golden hour", "weekend",
]

FLAVOR = [
    "vinyl", "cassette", "turntable", "headphones", "live show", "small venue",
    "record store", "playlist", "bandcamp", "drum machine", "tape loops", "samples",
    "acoustic set", "sound check", "encore", "opening act", "reissue", "demo tape",
]

TITLE_TEMPLATES = [
    "Hot take: {genre} is underrated",
    "What's your go-to {genre} album?",
    "Looking for {genre} recommendations",
    "Best {mood} playlist?",
    "Anyone else into {genre} lately?",
    "{genre} fans, where do I start?",
    "Album that got you through the week",
    "Underrated {genre} records everyone should hear",
    "{mood} tunes thread — drop yours",
    "Your favorite {genre} {flavor} moment",
    "Unpopular opinion about {genre}",
    "What are you spinning tonight?",
    "Concerts you're excited about this year",
    "Best {genre} set you've ever seen live",
    "{mood} and {genre} — name a better combo",
    "Songs that feel like {mood}",
    "Local {genre} scene check-in",
    "What's on repeat for you right now?",
]

DESCRIPTION_TEMPLATES = [
    "I've been deep in {genre} this week. {sentence} What are you all listening to?",
    "Recently picked up some {flavor}s and rediscovered {genre}. {sentence}",
    "There's something about {genre} on a {mood} that hits different. {sentence}",
    "My {mood} playlist has been mostly {genre} lately. {sentence} Drop your picks below.",
    "Saw a {genre} show at a {flavor} last night. {sentence} Anyone else been?",
    "Looking to branch out from {genre}. {sentence} Where should I go next?",
    "This might be a hot take, but {genre} deserves way more love. {sentence}",
    "Made a {mood} mixtape full of {genre}. {sentence} Happy to share it.",
    "The {genre} community here is so welcoming. {sentence} Latest favorite track?",
    "Digging through old {flavor}s found some gems. {sentence} {genre} era appreciation thread.",
    "I want to get into {genre} properly. {sentence} Essential albums only, please.",
    "What's the last song that gave you goosebumps? {sentence} Mine was {genre}.",
    "Between {genre} and {mood} sessions, my speakers have had a workout. {sentence}",
]


MEME_TITLES = [
    "POV: you finally found that song you've been hunting for months",
    "me when the lo-fi beat finally drops",
    "nobody: ... vinyl collectors at 3am:",
    "it's 2am and I'm one track away from a new personality",
    "rate my listening setup (be honest)",
    "this is your sign to listen to {genre}",
    "my brain during a drum solo:",
    "when the algorithm plays exactly the song you needed",
    "unpopular opinion: side B is where the magic happens",
    "the amount of times I've replayed this one guitar riff",
    "me explaining why this 14-minute track is a masterpiece",
    "current mood: pressing play and disappearing",
    "first time hearing {genre} be like:",
    "that moment a live version becomes the definitive version",
    "me: I'll just listen to one song. also me, four hours later:",
]

MEME_DESCRIPTIONS = [
    "caption says it all. {sentence}",
    "no thoughts, just {mood} and this track on repeat. {sentence}",
    "you already know what I'm about to say. {sentence}",
    "judge me all you want. {sentence}",
    "this one's for the {genre} people. {sentence}",
    "tag someone who needs this today. {sentence}",
    "I'm not crying, it's just a really good chord progression. {sentence}",
    "my therapist says I should talk about my feelings, so here's a playlist instead. {sentence}",
    "if this doesn't make sense to you, you haven't listened enough times yet. {sentence}",
    "the look on my face when the chorus hits. {sentence}",
    "send this to the person who put you on to {genre}. {sentence}",
]

def music_title(fake):
    return random.choice(TITLE_TEMPLATES).format(
        genre=random.choice(GENRES),
        mood=random.choice(MOODS),
        flavor=random.choice(FLAVOR),
    ).rstrip(".")[:200]


def music_description(fake):
    return random.choice(DESCRIPTION_TEMPLATES).format(
        genre=random.choice(GENRES),
        mood=random.choice(MOODS),
        flavor=random.choice(FLAVOR),
        sentence=fake.sentence(nb_words=random.randint(8, 16)),
    )[:500]


def meme_title(fake):
    return random.choice(MEME_TITLES).format(
        genre=random.choice(GENRES),
        mood=random.choice(MOODS),
    ).rstrip(".")[:200]


def meme_description(fake):
    return random.choice(MEME_DESCRIPTIONS).format(
        genre=random.choice(GENRES),
        mood=random.choice(MOODS),
        sentence=fake.sentence(nb_words=random.randint(6, 12)),
    )[:500]


class Command(BaseCommand):
    help = "Seed demo users, topics, replies and interactions with fake data."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=100, help="Number of topics to create.")
        parser.add_argument("--users", type=int, default=USER_COUNT, help="Number of demo users to create.")
        parser.add_argument("--days", type=int, default=90, help="Max age in days for new topics (some land within hours).")
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete previously seeded data and demo users before creating new data.",
        )

    def handle(self, *args, **options):
        count = options["count"]
        user_count = options["users"]
        days = options["days"]
        fake = Faker()
        random.seed(1337)
        fake.seed_instance(1337)
        now = timezone.now()

        if options["flush"]:
            self.flush()
            self.stdout.write(self.style.WARNING("Flushed previously seeded data."))

        users = self.seed_users(user_count, fake)
        topics, memes = self.seed_topics(count, days, users, fake, now)
        replies = self.seed_replies(topics, users, fake, now)
        self.seed_interactions(topics, replies, users, fake, now)
        self.seed_follows(users, fake)

        clear_topic_cache()

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(users)} users, {len(topics)} topics "
            f"({sum(1 for t in topics if t.image)} with images, {memes} memes), "
            f"{len(replies)} replies."
        ))
        self.stdout.write(
            f"Demo users: password is '{DEMO_PASSWORD}' for all seeded accounts "
            f"(e.g. {users[0].username})."
        )

    def flush(self):
        User.objects.filter(
            Q(username__startswith=USER_PREFIX) | Q(email__endswith='@seed.example')
        ).delete()

    def seed_users(self, user_count, fake):
        users = list(User.objects.filter(
            Q(username__startswith=USER_PREFIX) | Q(email__endswith='@seed.example')
        ))
        existing = len(users)
        used = set(User.objects.values_list('username', flat=True))
        now = timezone.now()
        for i in range(existing, user_count):
            username = self._natural_username(fake, used)
            users.append(User.objects.create_user(
                username=username,
                email=f"{username}@seed.example",
                password=DEMO_PASSWORD,
                bio=fake.sentence(nb_words=12),
                avatar=f"https://picsum.photos/seed/av-{username}/200/200",
                banner=f"https://picsum.photos/seed/bn-{username}/1200/400",
                last_seen=now - timedelta(minutes=random.randint(1, 60 * 24 * 3)),
            ))
        return users

    def _natural_username(self, fake, used):
        for _ in range(100):
            first = fake.first_name().lower()
            last = fake.last_name().lower()
            variant = random.choice([
                f"{first}.{last}",
                f"{first}_{last}",
                f"{first}{last}",
                f"{last}{first[0]}",
                f"{first}.{last[0]}",
            ])
            username = re.sub(r'[^a-z0-9_.]', '', variant)[:28]
            if username and username not in used:
                used.add(username)
                return username
        username = fake.user_name()[:28]
        while username in used:
            username = f"{username}{random.randint(10, 99)}"
        used.add(username)
        return username

    def seed_topics(self, count, days, users, fake, now):
        topics = []
        meme_count = 0
        for i in range(count):
            author = random.choice(users)
            if days <= 30 and random.random() < 0.15:
                created = now - timedelta(minutes=random.randint(5, 180))
            else:
                created = now - timedelta(
                    days=random.randint(0, max(0, days - 1)),
                    minutes=random.randint(0, 60 * 23),
                )
            updated = created + timedelta(minutes=random.randint(0, 180))
            if updated > now:
                updated = now
            kind = random.choices(
                ['music', 'meme', 'share'],
                weights=[0.62, 0.28, 0.10],
            )[0]
            if kind == 'share' and len(users) > 1:
                original = random.choice([u for u in users if u != author])
                title = f"Shared @{original.username}'s post"[:200]
                description = (
                    f"{music_description(fake)}\n\n---\n"
                    f'Originally shared from @{original.username}: "{music_title(fake)}"'
                )[:500]
                image_roll = 0.6
            elif kind == 'meme':
                title = meme_title(fake)
                description = meme_description(fake)
                image_roll = 0.35
                meme_count += 1
            else:
                title = music_title(fake)
                description = music_description(fake)
                image_roll = 0.6
            image = f"https://picsum.photos/seed/sf-{i}/900/600" if random.random() < image_roll else ""
            topics.append(Topic(
                title=title,
                description=description,
                image=image,
                user=author,
                created=created,
                updated=updated,
            ))
        Topic.objects.bulk_create(topics)
        return topics, meme_count

    def seed_replies(self, topics, users, fake, now):
        top_level = []
        for topic in topics:
            reply_count = random.choices(
                range(0, MAX_REPLIES + 1),
                weights=[18, 20, 18, 14, 10, 8, 5, 4, 3],
            )[0]
            for _ in range(reply_count):
                author = random.choice(users)
                created = topic.created + timedelta(
                    minutes=random.randint(1, 60 * 24 * 5)
                )
                if created > now:
                    created = now
                top_level.append(Reply(
                    topic=topic,
                    user=author,
                    content=fake.text(max_nb_chars=random.randint(40, 300)).replace("\n", " "),
                    created=created,
                ))
        Reply.objects.bulk_create(top_level)

        children = []
        for reply in top_level:
            if random.random() < 0.25:
                child_created = reply.created + timedelta(minutes=random.randint(5, 60 * 12))
                if child_created > now:
                    child_created = now
                children.append(Reply(
                    topic=reply.topic,
                    parent=reply,
                    user=random.choice(users),
                    content=fake.text(max_nb_chars=random.randint(40, 300)).replace("\n", " "),
                    created=child_created,
                ))
        Reply.objects.bulk_create(children)
        return top_level + children

    def seed_interactions(self, topics, replies, users, fake, now):
        topic_type = ContentType.objects.get_for_model(Topic)
        reply_type = ContentType.objects.get_for_model(Reply)

        topic_likes = set()
        for topic in topics:
            for user in random.sample(users, random.randint(0, min(15, len(users)))):
                topic_likes.add((user, topic))
        Likes.objects.bulk_create(
            [Likes(user=u, topic=t) for u, t in topic_likes],
            ignore_conflicts=True,
        )

        reply_likes = set()
        for reply in replies:
            for user in random.sample(users, random.randint(0, min(6, len(users)))):
                reply_likes.add((user, reply))
        Likes.objects.bulk_create(
            [Likes(user=u, reply=r) for u, r in reply_likes],
            ignore_conflicts=True,
        )

        bookmarks = set()
        for topic in topics:
            if random.random() < 0.3:
                for user in random.sample(users, random.randint(1, 3)):
                    bookmarks.add((user, topic_type, topic.id))
        for reply in random.sample(replies, min(len(replies), len(replies) // 4)):
            for user in random.sample(users, random.randint(1, 2)):
                bookmarks.add((user, reply_type, reply.id))
        Bookmark.objects.bulk_create(
            [Bookmark(user=u, content_type=ct, object_id=oid) for u, ct, oid in bookmarks],
            ignore_conflicts=True,
        )

        shares = set()
        for topic in topics:
            if random.random() < 0.15:
                for user in random.sample(users, random.randint(1, 2)):
                    shares.add((user, topic_type, topic.id))
        for reply in random.sample(replies, min(len(replies), len(replies) // 6)):
            if random.random() < 0.5:
                shares.add((random.choice(users), reply_type, reply.id))
        Share.objects.bulk_create(
            [Share(user=u, content_type=ct, object_id=oid) for u, ct, oid in shares],
            ignore_conflicts=True,
        )

    def seed_follows(self, users, fake):
        follows = set()
        for _ in range(len(users) * 3):
            follower, following = random.sample(users, 2)
            follows.add((follower, following))
        Follow.objects.bulk_create(
            [Follow(follower=f, following=g) for f, g in follows],
            ignore_conflicts=True,
        )
