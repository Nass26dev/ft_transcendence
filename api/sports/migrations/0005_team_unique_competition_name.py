from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("sports", "0004_merge_duplicate_teams"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="team",
            unique_together={("competition", "name")},
        ),
    ]
