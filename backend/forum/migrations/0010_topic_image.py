from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0009_rename_forum_reply_created_aa01_idx_core_reply_created_7391ca_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='topic',
            name='image',
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
