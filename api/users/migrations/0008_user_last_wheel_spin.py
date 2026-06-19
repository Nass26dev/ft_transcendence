from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_alter_user_wallet'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='last_wheel_spin',
            field=models.DateField(blank=True, null=True),
        ),
    ]
