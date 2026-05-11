from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("matches", "0002_alter_match_competition_alter_match_status_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="match",
            name="minute",
            field=models.SmallIntegerField(null=True, blank=True),
        ),
    ]