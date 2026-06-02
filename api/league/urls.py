from django.urls import path
from .views import (
    CreateLeague,
    LeagueList,
    SendLeagueRequest,
    AcceptInvitation,
    DeclineInvitation,
    MemberInLeague,
    LeagueInvitationList,
    LeaveLeague,
    KickMember,
    LeagueDetail,
    AllLeague,
)

urlpatterns = [

    path("create/", CreateLeague.as_view()),
    path("list/", LeagueList.as_view()),
    path("<int:league_id>/", LeagueDetail.as_view()),

   
    path("<int:league_id>/members/", MemberInLeague.as_view()),
    path("<int:league_id>/leave/", LeaveLeague.as_view()),
    path("<int:league_id>/kick/<int:user_id>/", KickMember.as_view()),

    path("invite/", SendLeagueRequest.as_view()),
    path("invitations/", LeagueInvitationList.as_view()),
    path("invitations/<int:invitation_id>/accept/", AcceptInvitation.as_view()),
    path("invitations/<int:invitation_id>/decline/", DeclineInvitation.as_view()),
    
    path("all-league/",AllLeague.as_view()),
]