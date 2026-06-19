from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_user_is_public'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='wallet',
            field=models.DecimalField(decimal_places=2, default=100.0, max_digits=14),
        ),
    ]
