"""
matches/migrations/0001_initial.py
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Match',
            fields=[
                ('id',              models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id_api',          models.IntegerField(null=True, unique=True)),
                ('competition',     models.CharField(max_length=10)),   # L1 | UCL | PL | LIGA | BUN | SA
                ('home_team',       models.CharField(max_length=100)),
                ('away_team',       models.CharField(max_length=100)),
                ('home_team_crest', models.URLField(blank=True, max_length=500, null=True)),
                ('away_team_crest', models.URLField(blank=True, max_length=500, null=True)),
                ('time',            models.DateTimeField()),
                ('status',          models.CharField(max_length=20, default='soon')),  # soon | live | finished
                ('minute',          models.SmallIntegerField(null=True, blank=True)),
                ('home_score',      models.IntegerField(blank=True, null=True)),
                ('away_score',      models.IntegerField(blank=True, null=True)),
                # Cotes 1 / X / 2
                ('odd_home',        models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)),
                ('odd_draw',        models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)),
                ('odd_away',        models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)),
                # Confiance communautaire (%)
                ('conf_home',       models.SmallIntegerField(null=True, blank=True)),
                ('conf_draw',       models.SmallIntegerField(null=True, blank=True)),
                ('conf_away',       models.SmallIntegerField(null=True, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Standing',
            fields=[
                ('id',            models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('competition',   models.CharField(max_length=10)),
                ('team_name',     models.CharField(max_length=150)),
                ('rank',          models.SmallIntegerField()),
                ('played',        models.SmallIntegerField(default=0)),
                ('wins',          models.SmallIntegerField(default=0)),
                ('draws',         models.SmallIntegerField(default=0)),
                ('losses',        models.SmallIntegerField(default=0)),
                ('goals_for',     models.SmallIntegerField(default=0)),
                ('goals_against', models.SmallIntegerField(default=0)),
                ('goal_diff',     models.SmallIntegerField(default=0)),
                ('points',        models.SmallIntegerField(default=0)),
                ('updated_at',    models.DateTimeField(auto_now=True)),
            ],
            options={
                'unique_together': {('competition', 'team_name')},
            },
        ),
        migrations.AddIndex(
            model_name='match',
            index=models.Index(fields=['competition', 'time'], name='idx_match_comp_time'),
        ),
        migrations.AddIndex(
            model_name='match',
            index=models.Index(fields=['status'], name='idx_match_status'),
        ),
        migrations.AddIndex(
            model_name='match',
            index=models.Index(fields=['time'], name='idx_match_time'),
        ),
        migrations.AddIndex(
            model_name='standing',
            index=models.Index(fields=['competition', 'rank'], name='idx_standing_comp_rank'),
        ),
    ]