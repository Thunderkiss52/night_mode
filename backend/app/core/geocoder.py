from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import Settings


@dataclass(frozen=True)
class ReverseGeocodeResult:
    city: str | None = None
    country: str | None = None


class ReverseGeocoder:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.timeout_seconds = max(settings.geocoder_timeout_seconds, 1)

    def reverse(self, lat: float, lng: float) -> ReverseGeocodeResult | None:
        for provider in self._provider_order():
            result = provider(lat, lng)
            if result and (result.city or result.country):
                return result
        return None

    def _provider_order(self) -> list:
        providers = {
            'nominatim': self._reverse_via_nominatim,
            'yandex': self._reverse_via_yandex,
            'google': self._reverse_via_google,
        }

        primary = self.settings.geocoder_primary.strip().lower()
        order = [primary, 'nominatim', 'yandex', 'google']

        seen: set[str] = set()
        result = []
        for name in order:
            if name in providers and name not in seen:
                result.append(providers[name])
                seen.add(name)
        return result

    def _reverse_via_nominatim(self, lat: float, lng: float) -> ReverseGeocodeResult | None:
        api_key = self.settings.nominatim_api_key.strip()
        primary = self.settings.geocoder_primary.strip().lower()
        if not api_key and primary != 'nominatim':
            return None

        params: dict[str, str] = {
            'format': 'jsonv2',
            'lat': str(lat),
            'lon': str(lng),
            'addressdetails': '1',
        }
        if api_key:
            params['key'] = api_key
        if self.settings.nominatim_email.strip():
            params['email'] = self.settings.nominatim_email.strip()

        payload = self._get_json(
            self.settings.nominatim_reverse_url,
            params=params,
            headers={
                'User-Agent': self.settings.nominatim_user_agent,
                'Accept': 'application/json',
            },
        )
        if not payload:
            return None

        address = payload.get('address') if isinstance(payload, dict) else None
        if not isinstance(address, dict):
            return None

        city = (
            address.get('city')
            or address.get('town')
            or address.get('village')
            or address.get('municipality')
            or address.get('county')
            or address.get('state')
        )
        country = address.get('country')
        return self._normalize(city, country)

    def _reverse_via_yandex(self, lat: float, lng: float) -> ReverseGeocodeResult | None:
        api_key = self.settings.yandex_geocoder_api_key.strip()
        if not api_key:
            return None

        payload = self._get_json(
            self.settings.yandex_geocoder_url,
            params={
                'apikey': api_key,
                'format': 'json',
                'geocode': f'{lng},{lat}',
                'results': '1',
                'lang': 'ru_RU',
            },
            headers={'Accept': 'application/json'},
        )
        if not payload:
            return None

        try:
            members = payload['response']['GeoObjectCollection']['featureMember']
            first = members[0]['GeoObject']['metaDataProperty']['GeocoderMetaData']['Address']
        except (KeyError, IndexError, TypeError):
            return None

        components = first.get('Components', [])
        city = self._pick_component(components, {'locality', 'province', 'area', 'district'})
        country = self._pick_component(components, {'country'})
        return self._normalize(city, country)

    def _reverse_via_google(self, lat: float, lng: float) -> ReverseGeocodeResult | None:
        api_key = self.settings.google_geocoder_api_key.strip()
        if not api_key:
            return None

        payload = self._get_json(
            self.settings.google_geocoder_url,
            params={
                'latlng': f'{lat},{lng}',
                'key': api_key,
                'language': 'ru',
            },
            headers={'Accept': 'application/json'},
        )
        if not payload or payload.get('status') != 'OK':
            return None

        results = payload.get('results')
        if not isinstance(results, list) or not results:
            return None

        components = results[0].get('address_components', [])
        city = self._pick_google_component(
            components,
            {'locality', 'postal_town', 'administrative_area_level_2', 'administrative_area_level_1'},
        )
        country = self._pick_google_component(components, {'country'})
        return self._normalize(city, country)

    def _get_json(
        self,
        base_url: str,
        params: dict[str, str],
        headers: dict[str, str] | None = None,
    ) -> dict | None:
        url = f'{base_url}?{urlencode(params)}'
        request = Request(url=url, headers=headers or {})
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                raw = response.read().decode('utf-8')
            data = json.loads(raw)
            return data if isinstance(data, dict) else None
        except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
            return None

    @staticmethod
    def _pick_component(components: list, kinds: set[str]) -> str | None:
        for item in components:
            if not isinstance(item, dict):
                continue
            if item.get('kind') in kinds and isinstance(item.get('name'), str):
                return item['name']
        return None

    @staticmethod
    def _pick_google_component(components: list, required_types: set[str]) -> str | None:
        for item in components:
            if not isinstance(item, dict):
                continue
            types = item.get('types')
            if not isinstance(types, list):
                continue
            if required_types.intersection(set(types)) and isinstance(item.get('long_name'), str):
                return item['long_name']
        return None

    @staticmethod
    def _normalize(city: str | None, country: str | None) -> ReverseGeocodeResult | None:
        normalized_city = city.strip() if isinstance(city, str) else ''
        normalized_country = country.strip() if isinstance(country, str) else ''
        if not normalized_city and not normalized_country:
            return None
        return ReverseGeocodeResult(
            city=normalized_city or None,
            country=normalized_country or None,
        )
