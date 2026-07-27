from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0007_alter_topic_created_alter_topic_updated'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reply',
            name='content',
            field=models.TextField(max_length=10000),
        ),
        migrations.AddIndex(
            model_name='reply',
            index=models.Index(fields=['created'], name='forum_reply_created_aa01_idx'),
        ),
        migrations.AddIndex(
            model_name='reply',
            index=models.Index(fields=['topic', 'created'], name='forum_reply_topic_created_aa02_idx'),
        ),
    ]
