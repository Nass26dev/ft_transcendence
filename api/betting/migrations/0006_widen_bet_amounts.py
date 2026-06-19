from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('betting', '0005_remove_bet_match_remove_bet_odd_alter_bet_odd_value_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bet',
            name='stake',
            field=models.DecimalField(decimal_places=2, max_digits=14),
        ),
        migrations.AlterField(
            model_name='bet',
            name='odd_value',
            field=models.DecimalField(decimal_places=2, max_digits=14),
        ),
    ]
