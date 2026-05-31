from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('betting', '0002_remove_bet_odd_value_remove_bet_potential_win'),
    ]

    operations = [
        migrations.AddField(
            model_name='bet',
            name='odd_value',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=6),
            preserve_default=False,
        ),
    ]
